import React from "react";
import { Ajax, Stats, User } from "seatsurfing-commons";
import { Card, Row, Col, ProgressBar, Alert, Button } from "react-bootstrap";
import { NextRouter } from "next/router";
import FullLayout from "@/components/FullLayout";
import Loading from "@/components/Loading";
import withReadyRouter from "@/components/withReadyRouter";
import { TranslationFunc, withTranslation } from "@/components/withTranslation";
import RuntimeConfig from "@/components/RuntimeConfig";
import Link from "next/link";
import PremiumFeatureIcon from "@/components/PremiumFeatureIcon";

interface State {
  loading: boolean;
  redirect: string;
  spaceAdmin: boolean;
  orgAdmin: boolean;
  latestVersion: any;
}

interface Props {
  router: NextRouter;
  t: TranslationFunc;
}

class Dashboard extends React.Component<Props, State> {
  stats: Stats | null;

  constructor(props: any) {
    super(props);
    this.stats = null;
    this.state = {
      loading: true,
      redirect: "",
      spaceAdmin: false,
      orgAdmin: false,
      latestVersion: null,
    };
  }

  componentDidMount = () => {
    if (!Ajax.CREDENTIALS.accessToken) {
      this.props.router.push("/login");
      return;
    }
    let promises = [this.loadItems(), this.getUserInfo(), this.checkUpdates()];
    Promise.all(promises)
      .then(() => {
        this.setState({ loading: false });
      })
      .catch((e) => {
        this.props.router.push("/login");
        return;
      });
  };

  checkUpdates = async (): Promise<void> => {
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      Ajax.get("/uc/")
        .then((res) => {
          self.setState(
            {
              latestVersion: res.json,
            },
            () => resolve()
          );
        })
        .catch(() => {
          console.warn("Could not check for updates.");
          let res = { version: "", updateAvailable: false };
          self.setState(
            {
              latestVersion: res,
            },
            () => resolve()
          );
        });
    });
  };

  getUserInfo = async (): Promise<void> => {
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      User.getSelf()
        .then((user) => {
          self.setState(
            {
              spaceAdmin: user.spaceAdmin,
              orgAdmin: user.admin,
            },
            () => resolve()
          );
        })
        .catch((e) => reject(e));
    });
  };

  loadItems = async (): Promise<void> => {
    let self = this;
    return new Promise<void>(function (resolve, reject) {
      Stats.get()
        .then((stats) => {
          self.stats = stats;
          resolve();
        })
        .catch((e) => reject(e));
    });
  };

  renderStatsCard = (num: number | undefined, title: string, link?: string) => {
    let redirect = "";
    if (link) {
      redirect = link;
    }
    return (
      <Col sm="2">
        <Card
          className="dashboard-card-clickable"
          onClick={() => this.setState({ redirect: redirect })}
        >
          <Card.Body>
            <Card.Title className="dashboard-number text-center">
              {num}
            </Card.Title>
            <Card.Subtitle className="text-center mb-2 text-muted">
              {title}
            </Card.Subtitle>
          </Card.Body>
        </Card>
      </Col>
    );
  };

  renderProgressBar = (num: number | undefined, title: string) => {
    if (!num) {
      num = 0;
    }
    let label = title + ": " + num + " %";
    let variant = "success";
    if (num >= 80) {
      variant = "danger";
    }
    if (num >= 60) {
      variant = "warning";
    }
    return (
      <div>
        {label} <ProgressBar now={num} className="mb-3" variant={variant} />
      </div>
    );
  };

  render() {
    if (this.state.redirect) {
      this.props.router.push(this.state.redirect);
      return <></>;
    }

    if (this.state.loading) {
      return (
        <FullLayout headline="Dashboard">
          <Loading />
        </FullLayout>
      );
    }

    let updateHint = <></>;
    const domain = window.location.host.split(":").shift();
    if (
      this.state.latestVersion &&
      this.state.latestVersion.updateAvailable &&
      !RuntimeConfig.INFOS.cloudHosted
    ) {
      updateHint = (
        <Row className="mb-4">
          <Col sm="8">
            <Alert variant="warning">
              <a
                href="https://github.com/seatsurfing/seatsurfing/releases"
                target="_blank"
                rel="noreferrer"
              >
                {this.props.t("updateAvailable", {
                  version: this.state.latestVersion.version,
                })}
              </a>
            </Alert>
          </Col>
        </Row>
      );
    }

    let cloudUpgradeHint = <></>;
    if (
      RuntimeConfig.INFOS.orgAdmin &&
      RuntimeConfig.INFOS.cloudHosted &&
      !RuntimeConfig.INFOS.subscriptionActive
    ) {
      cloudUpgradeHint = (
        <Row className="mb-4">
          <Col sm="8">
            <Alert variant="info">
              <p style={{ fontWeight: "bold" }}>
                <PremiumFeatureIcon style={{marginLeft: "0px", marginRight: "5px"}} />
                {this.props.t("cloudUpgradeHintHeadline")}
              </p>
              <p>
                <Link
                  href="/plugin/subscription/"
                >
                  {this.props.t("cloudUpgradeHintText")}
                </Link>{" "}
                🚀
              </p>
            </Alert>
          </Col>
        </Row>
      );
    }

    return (
      <FullLayout headline="Dashboard">
        {cloudUpgradeHint}
        {updateHint}
        <Row className="mb-4">
          {this.renderStatsCard(
            this.stats?.numUsers,
            this.props.t("users"),
            this.state.orgAdmin ? "/users/" : ""
          )}
          {this.renderStatsCard(
            this.stats?.numLocations,
            this.props.t("areas"),
            "/locations/"
          )}
          {this.renderStatsCard(
            this.stats?.numSpaces,
            this.props.t("spaces"),
            "/locations/"
          )}
          {this.renderStatsCard(
            this.stats?.numBookings,
            this.props.t("bookings"),
            "/bookings/"
          )}
        </Row>
        <Row className="mb-4">
          {this.renderStatsCard(
            this.stats?.numBookingsToday,
            this.props.t("today"),
            "/bookings/"
          )}
          {this.renderStatsCard(
            this.stats?.numBookingsYesterday,
            this.props.t("yesterday"),
            "/bookings/"
          )}
          {this.renderStatsCard(
            this.stats?.numBookingsThisWeek,
            this.props.t("thisWeek"),
            "/bookings/"
          )}
          {this.renderStatsCard(
            this.stats?.numBookingsLastWeek,
            this.props.t("lastWeek"),
            "/bookings/"
          )}
        </Row>
        <Row className="mb-4">
          <Col sm="8">
            <Card>
              <Card.Body>
                <Card.Title>{this.props.t("utilization")}</Card.Title>
                {this.renderProgressBar(
                  this.stats?.spaceLoadToday,
                  this.props.t("today")
                )}
                {this.renderProgressBar(
                  this.stats?.spaceLoadYesterday,
                  this.props.t("yesterday")
                )}
                {this.renderProgressBar(
                  this.stats?.spaceLoadThisWeek,
                  this.props.t("thisWeek")
                )}
                {this.renderProgressBar(
                  this.stats?.spaceLoadLastWeek,
                  this.props.t("lastWeek")
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </FullLayout>
    );
  }
}

export default withTranslation(withReadyRouter(Dashboard as any));
